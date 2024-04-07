/* eslint-disable no-await-in-loop */

const { SublinksClient } = require('sublinks-js-client');
const { entities, siteSetup, users } = require('./seed-data');

const { NEXT_PUBLIC_SUBLINKS_API_BASE_URL } = process.env;

const apiClient = new SublinksClient(NEXT_PUBLIC_SUBLINKS_API_BASE_URL, { insecure: true });

const MAX_ATTEMPTS = 20;
const RETRY_DELAY = 5000;
const commentsCache = {};
const likesCache = {};
let adminJwt;
let attempt = 1;

const waitForApi = async seedFn => {
  try {
    await apiClient.getSite();
    console.log('API connection OK!');
    seedFn();
  } catch (e) {
    if (attempt < MAX_ATTEMPTS) {
      attempt++;
      console.log('API not yet available. Waiting some more...');

      await new Promise(res => setTimeout(res, RETRY_DELAY));
      await waitForApi(seedFn);
    } else {
      console.error('Unable to connect to API', e);
    }
  }
};

const doesEntityAlreadyExist = async entity => {
  const { creator, data, type } = entity;
  const postId = data.post_id;

  switch(type) {
    case 'createCommunity':
      try {
        const communityRes = await apiClient.getCommunity({
          id: data.id
        });
        return !Boolean(communityRes.errors);
      } catch (e) {
        return false;
      }
    case 'createPost':
      try {
        const postRest = await apiClient.getPost({
          id: parseInt(data.id, 10)
        });
        return !Boolean(postRest.errors);
      } catch (e) {
        return false;
      }
    case 'createComment':
      try {
        if (!commentsCache[postId]) {
          const commentRes = await apiClient.getComments({
            sort: 'Hot',
            type_: 'All',
            post_id: postId,
            limit: 50
          });

          commentsCache[postId] = commentRes.comments;
        }

        if (!commentsCache[postId] || commentsCache[postId].length === 0) {
          return false;
        }

        return commentsCache[postId].some(commentView => commentView.comment.id === data.id);
      } catch (e) {
        return false;
      }
    case 'likePost':
      try {
        if (!likesCache[postId]) {
          // API gets upset if non-admins fetch likes for too many posts
          apiClient.setAuth(adminJwt);

          const likesRes = await apiClient.listPostLikes({
            post_id: postId
          });

          likesCache[postId] = likesRes.post_likes;
        }

        if (!likesCache[postId] || likesCache[postId].length === 0) {
          return false;
        }

        return likesCache[postId].some(voteView => voteView.creator.id === creator.data.id);
      } catch (e) {
        return false;
      }
    default:
      return false;
  }
};

const createUser = async user => {
  try {
    const userRes = await apiClient.getPersonDetails({ username: user.data.username });

    if (userRes.errors) {
      console.log(`Creating user with ID ${user.data.id}`);
      const registerRes = await apiClient.register(user.data);

      if (registerRes.errors) {
        throw Error(`User registration request failed: ${registerRes.message} -- ${JSON.stringify(registerRes.errors)}`);
      }
    }
  } catch (e) {
    console.log(`Failed creating user with ID ${user.data.id}`, e);
  }
};

const runInitialSiteSetup = async () => {
  console.log('Configuring site...');
  const { adminUser, siteData } = siteSetup;
  const site = await apiClient.getSite();
  const isSiteSetUp = site.site_view.local_site.site_setup;

  await createUser(adminUser);
  const { jwt } = await apiClient.login(adminUser.credentials);
  apiClient.setAuth(jwt);
  adminJwt = jwt;

  if (!isSiteSetUp) {
    const siteRes = await apiClient.createSite(siteData);

    if (siteRes.errors) {
      throw Error(`Site creation failed: ${siteRes.message} -- ${JSON.stringify(siteRes.errors)}`);
    }
  }

  console.log('Site configuration completed!');
};

const insertSeedData = async () => {
  try {
    await runInitialSiteSetup();

    const userKeys = Object.keys(users);
    const entityKeys = Object.keys(entities);

    console.log('Seeding users...');
    for (let i = 0; i < userKeys.length; i++) {
      const userKey = userKeys[i];
      const user = users[userKey];

      await createUser(user);
    }
    console.log('User seeding completed!');

    console.log('Seeding entities...');
    for (let i = 0; i < entityKeys.length; i++) {
      const entityKey = entityKeys[i];
      const entity = entities[entityKey];

      if (!await doesEntityAlreadyExist(entity)) {
        const { creator, data, type } = entity;
        console.log(`Running ${type}() for entity with ID ${data.id || data.post_id}`);

        const { jwt } = await apiClient.login(creator.credentials);
        apiClient.setAuth(jwt);

        if (data.image_url) {
          const fileRes = await fetch(data.image_url);
          const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
          const uploadRes = await apiClient.uploadImage({ image: fileBuffer });

          if (uploadRes.url) {
            data.url = uploadRes.url;
          } else if (uploadRes.errors) {
            console.log(`Failed uploading image for post ${data.id}: ${uploadRes.message} -- ${JSON.stringify(uploadRes.errors)}`);
          }
        }

        const entityFnRes = await apiClient[type](data);
        if (entityFnRes.errors) {
          console.log(`Failed to seed entity with ID ${data.id || data.post_id}: ${entityFnRes.message}`);
        }
      }
    }
    console.log('Entity seeding completed!');
  } catch (e) {
    console.log('Failed seeding data', e);
  } 
};

waitForApi(insertSeedData);
