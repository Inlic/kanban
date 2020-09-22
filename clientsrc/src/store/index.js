import Vue from "vue";
import Vuex from "vuex";
import router from "../router/index";
import { api } from "./AxiosService";

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
      console.log(payload);
      // state.tasks[payload.id] = payload.tasks;
      // NOTE Vue.set(object from state, your key, your value)
      Vue.set(state.tasks, payload.id, payload.tasks);
    },
    setComments(state, payload) {
      console.log(payload);
      Vue.set(state.comments, payload.id, payload.comments);
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
      console.log("new-list-res", res);
      commit("setLists", [...state.lists, res.data]);
    },
    //#endregion
  },
});
