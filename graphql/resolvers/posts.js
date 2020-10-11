const { AuthenticationError, UserInputError } = require("apollo-server");
const { withFilter } = require("apollo-server");

const Post = require("../../models/Post");
const Notification = require("../../models/Notification");
const checkAuth = require("../../util/check-auth");

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId);
        if (post) {
          return post;
        } else {
          throw new Error("Post not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = checkAuth(context);
      if (body.trim() === "") {
        throw new Error("Post body must not be empty");
      }

      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString(),
      });

      const post = await newPost.save();

      context.pubsub.publish("NEW_POST", {
        newPost: post,
        user,
      });
      return post;
    },
    async createNotification(_, args, context) {
      console.log({ _ });
      console.log({ args });
      const { newPost } = agrs;
      // const user = checkAuth(context);
      try {
        const newNot = new Notification({
          ...newPost,
          recipient: user.username,
        });

        const newNotRes = await newNot.save();
        console.log({ newNotRes });
      } catch (err) {
        throw new Error(err);
      }
    },
    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);

      try {
        const post = await Post.findById(postId);
        if (user.username === post.username) {
          await post.delete();
          return "Post deleted successfully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async likePost(_, { postId }, context) {
      const { username } = checkAuth(context);

      const post = await Post.findById(postId);
      if (post) {
        if (post.likes.find((like) => like.username === username)) {
          // Post already likes, unlike it
          post.likes = post.likes.filter((like) => like.username !== username);
        } else {
          // Not liked, like post
          post.likes.push({
            username,
            createdAt: new Date().toISOString(),
          });
        }

        await post.save();
        return post;
      } else throw new UserInputError("Post not found");
    },
  },
  Subscription: {
    newPost: {
      subscribe: async (root, args, { pubsub }) => {
        return pubsub.asyncIterator("NEW_POST");
      },
    },
  },
  // Subscription: {
  //   newPost: {
  //     subscribe: withFilter(
  //       (root, args, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
  //       async (payload, variables) => {
  //         const newPost = payload.payload;
  //         console.log({ payload });

  //         return payload.newPost.username !== payload.user.username;
  //       }
  //     ),
  //   },
  // },
};