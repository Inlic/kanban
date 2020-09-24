import Vue from "vue";
import Vuex from "vuex";
import router from "../router/index";
import { api } from "./AxiosService";
import SweetAlert from "../services/SweetAlert";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {},
    boards: [],
    activeBoard: {},
    lists: [],
    tasks: {},
    comments: {},
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setBoards(state, boards) {
      state.boards = boards;
    },
    setActiveBoard(state, activeBoard) {
      state.activeBoard = activeBoard;
    },

    setLists(state, lists) {
      state.lists = lists;
    },
    setTasks(state, payload) {
      // state.tasks[payload.id] = payload.tasks;
      // NOTE Vue.set(object from state, your key, your value)
      Vue.set(state.tasks, payload.id, payload.tasks);
    },
    setComments(state, payload) {
      Vue.set(state.comments, payload.id, payload.comments);
    },

    addTask(state, payload) {
      state.tasks[payload.listId].push(payload.task);
    },

    addComment(state, payload) {
      state.comments[payload.taskId].push(payload.comment);
    },

    deleteBoard(state, id) {
      state.boards = state.boards.filter((b) => b.id != id);
    },

    deleteList(state, id) {
      state.lists = state.lists.filter((l) => l.id != id);
    },

    deleteTask(state, payload) {
      state.tasks[payload.listId] = state.tasks[payload.listId].filter(
        (t) => t.id != payload.id
      );
    },
    deleteComment(state, payload) {
      state.comments[payload.taskId] = state.comments[payload.taskId].filter(
        (c) => c.id != payload.id
      );
    },
  },
  actions: {
    //#region -- AUTH STUFF --
    setBearer({}, bearer) {
      api.defaults.headers.authorization = bearer;
    },
    resetBearer() {
      api.defaults.headers.authorization = "";
    },
    async getProfile({ commit }) {
      try {
        let res = await api.get("/profile");
        commit("setUser", res.data);
      } catch (err) {
        console.error(err);
      }
    },
    //#endregion

    //#region -- BOARDS --
    getBoards({ commit, dispatch }) {
      api.get("boards").then((res) => {
        commit("setBoards", res.data);
      });
    },
    async deleteBoard({ commit }, id) {
      if (await SweetAlert.sweetDelete("This board will be gone.")) {
        await api.delete("boards/" + id);
        commit("deleteBoard", id);
      }
    },

    async deleteList({ commit }, id) {
      if (await SweetAlert.sweetDelete("This list will be gone.")) {
      await api.delete("lists/" + id);
      commit("deleteList", id);
      }
    },

    async deleteTask({ commit }, payload) {
      if (await SweetAlert.sweetDelete("This task will be gone.")) {
      await api.delete("tasks/" + payload.id);
      commit("deleteTask", payload);
      }
    },

    async deleteComment({ commit }, payload) {
      if (await SweetAlert.sweetDelete("This comment will be gone.")) {
      await api.delete("comments/" + payload.id);
      commit("deleteComment", payload);
      }
    },

    addBoard({ commit, dispatch }, boardData) {
      api.post("boards", boardData).then((serverBoard) => {
        dispatch("getBoards");
      });
    },

    async getActiveBoard({ commit }, id) {
      try {
        let res = await api.get("boards/" + id);
        commit("setActiveBoard", res.data);
      } catch (error) {
        console.error("cannot get active board");
      }
    },

    async getListsByBoardId({ commit }, id) {
      try {
        let res = await api.get("boards/" + id + "/lists");
        commit("setLists", res.data);
      } catch (error) {
        console.error("cannot get lists");
      }
    },
    async editBoard({ commit, state }, editData) {
      try {
        let res = await api.put("boards/" + state.activeBoard.id, editData);
        commit("setActiveBoard", res.data);
        SweetAlert.toast("Board Edited")
      } catch (error) {
        console.error(error);
      }
    },
    async editList({ commit, state }, editData) {
      try {
        let res = await api.put("lists/" + editData.id, editData);
        let index = state.lists.findIndex((l) => l.id == res.data.id);
        state.lists.splice(index, 1, res.data);
        commit("setLists", state.lists);
        SweetAlert.toast("List Edited")
      } catch (error) {
        console.error(error);
      }
    },
    async editTask({ commit, state, dispatch }, editData) {
      console.log(editData);
      try {
        let res = await api.put("tasks/" + editData.id, editData);
        let index = state.tasks[res.data.listId].findIndex(
          (t) => t.id == res.data.id
        );
        state.tasks[res.data.listId].splice(index, 1, res.data);
        commit("setTasks", state.tasks);
        dispatch("getTasksByListId", res.data.listId);
        dispatch("getTasksByListId", editData.oldId);
        SweetAlert.toast("Task Edited")
      } catch (error) {
        console.error(error);
      }
    },
    async editComment({ commit, state }, editData) {
      try {
        let res = await api.put("comments/" + editData.id, editData);
        let index = state.comments[res.data.taskId].findIndex(
          (c) => c.id == res.data.id
        );
        state.comments[res.data.taskId].splice(index, 1, res.data);
        commit("setComments", state.comments);
        SweetAlert.toast("Comment Edited")
      } catch (error) {
        console.error(error);
      }
    },
    //#endregion

    //#region -- LISTS --
    async getTasksByListId({ commit }, id) {
      try {
        let res = await api.get("lists/" + id + "/tasks");
        commit("setTasks", { tasks: res.data, id });
      } catch (error) {
        console.error("cannot get tasks");
      }
    },

    async getCommentsByTaskId({ commit }, id) {
      try {
        let res = await api.get("tasks/" + id + "/comments");
        commit("setComments", { comments: res.data, id });
      } catch (error) {
        console.error("cannot get comments");
      }
    },

    async createList({ commit, state }, newList) {
      let res = await api.post("lists", newList);
      commit("setLists", [...state.lists, res.data]);
    },

    async createTask({ dispatch, commit }, newTask) {
      let res = await api.post("tasks", newTask);
      commit("addTask", { listId: res.data.listId, task: res.data });
      // NOTE This worked too, but it requires an extra call to the database
      // dispatch("getTasksByListId", res.data.listId);
    },

    async createComment({ commit }, newComment) {
      let res = await api.post("comments", newComment);
      commit("addComment", { taskId: res.data.taskId, comment: res.data });
    },
    //#endregion
  },
});
