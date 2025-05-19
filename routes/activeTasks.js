import api from '../api'

export default {
  namespaced: true,
  state: {
    items: []
  },
  mutations: {
    setActiveTasks(state, list) {
      state.items = list
    },
    addActiveTask(state, item) {
      if (!state.items.find(t => t.task.id === item.task.id)) {
        state.items.push(item)
      }
    },
    removeActiveTask(state, taskId) {
      state.items = state.items.filter(t => t.task.id !== taskId)
    },
    reorderActiveTasks(state, orderedTasks) {
      state.items = orderedTasks
    }
  },
  actions: {
    async fetchActiveTasks({ commit }) {
      const res = await api.get('/api/active-tasks')
      commit('setActiveTasks', res.data)
    },
    async addActiveTask({ commit }, taskId) {
      const res = await api.post('/api/active-tasks', { taskId })
      commit('addActiveTask', res.data)
    },
    async removeActiveTask({ commit }, taskId) {
      await api.delete(`/api/active-tasks/${taskId}`)
      commit('removeActiveTask', taskId)
    },
    async reorderActiveTasks({ commit }, taskIds) {
      await api.put('/api/active-tasks/reorder', {
        orderedTaskIds: taskIds
      })
      commit('reorderActiveTasks', taskIds.map(id => ({
        task: { id }
      }))) // структура фиктивная, если нужно — fetchActiveTasks после
    }
  },
  getters: {
    allActiveTasks(state) {
      return state.items.map(i => i.task)
    }
  }
}