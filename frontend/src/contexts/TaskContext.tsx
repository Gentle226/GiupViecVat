import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskCategory,
  TaskStatus,
} from "../../../shared/types";
import { tasksAPI } from "../services/api";

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  myTasks: Task[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: {
    category?: TaskCategory;
    status?: TaskStatus;
    location?: { lat: number; lng: number; radius: number };
    search?: string;
  };
}

interface TaskContextType extends TaskState {
  loadTasks: (page?: number) => Promise<void>;
  loadTask: (id: string) => Promise<void>;
  createTask: (taskData: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  loadMyTasks: () => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskState["filters"]>) => void;
  clearError: () => void;
  clearCurrentTask: () => void;
}

type TaskAction =
  | { type: "LOAD_TASKS_START" }
  | {
      type: "LOAD_TASKS_SUCCESS";
      payload: { tasks: Task[]; total: number; pages: number };
    }
  | { type: "LOAD_TASKS_FAILURE"; payload: string }
  | { type: "LOAD_TASK_SUCCESS"; payload: Task }
  | { type: "CREATE_TASK_SUCCESS"; payload: Task }
  | { type: "UPDATE_TASK_SUCCESS"; payload: Task }
  | { type: "DELETE_TASK_SUCCESS"; payload: string }
  | { type: "LOAD_MY_TASKS_SUCCESS"; payload: Task[] }
  | { type: "SET_FILTERS"; payload: Partial<TaskState["filters"]> }
  | { type: "SET_PAGE"; payload: number }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_CURRENT_TASK" };

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  myTasks: [],
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  filters: {},
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case "LOAD_TASKS_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOAD_TASKS_SUCCESS":
      return {
        ...state,
        tasks: action.payload.tasks,
        totalPages: action.payload.pages,
        isLoading: false,
        error: null,
      };
    case "LOAD_TASKS_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "LOAD_TASK_SUCCESS":
      return {
        ...state,
        currentTask: action.payload,
        isLoading: false,
        error: null,
      };
    case "CREATE_TASK_SUCCESS":
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        myTasks: [action.payload, ...state.myTasks],
        isLoading: false,
        error: null,
      };
    case "UPDATE_TASK_SUCCESS":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        ),
        myTasks: state.myTasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        ),
        currentTask:
          state.currentTask?._id === action.payload._id
            ? action.payload
            : state.currentTask,
        isLoading: false,
        error: null,
      };
    case "DELETE_TASK_SUCCESS":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task._id !== action.payload),
        myTasks: state.myTasks.filter((task) => task._id !== action.payload),
        currentTask:
          state.currentTask?._id === action.payload ? null : state.currentTask,
        isLoading: false,
        error: null,
      };
    case "LOAD_MY_TASKS_SUCCESS":
      return {
        ...state,
        myTasks: action.payload,
        isLoading: false,
        error: null,
      };
    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        currentPage: 1,
      };
    case "SET_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "CLEAR_CURRENT_TASK":
      return {
        ...state,
        currentTask: null,
      };
    default:
      return state;
  }
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const loadTasks = useCallback(
    async (page: number = 1) => {
      try {
        dispatch({ type: "LOAD_TASKS_START" });
        dispatch({ type: "SET_PAGE", payload: page });

        const response = await tasksAPI.getTasks({
          ...state.filters,
          page,
          limit: 12,
        });

        if (response.success && response.data) {
          dispatch({
            type: "LOAD_TASKS_SUCCESS",
            payload: response.data,
          });
        } else {
          dispatch({
            type: "LOAD_TASKS_FAILURE",
            payload: response.message || "Failed to load tasks",
          });
        }
      } catch (error: any) {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: error.message || "Failed to load tasks",
        });
      }
    },
    [state.filters]
  );

  const loadTask = useCallback(async (id: string) => {
    try {
      dispatch({ type: "LOAD_TASKS_START" });
      const response = await tasksAPI.getTask(id);

      if (response.success && response.data) {
        dispatch({
          type: "LOAD_TASK_SUCCESS",
          payload: response.data,
        });
      } else {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: response.message || "Failed to load task",
        });
      }
    } catch (error: any) {
      dispatch({
        type: "LOAD_TASKS_FAILURE",
        payload: error.message || "Failed to load task",
      });
    }
  }, []);

  const createTask = useCallback(async (taskData: CreateTaskRequest) => {
    try {
      dispatch({ type: "LOAD_TASKS_START" });
      const response = await tasksAPI.createTask(taskData);

      if (response.success && response.data) {
        dispatch({
          type: "CREATE_TASK_SUCCESS",
          payload: response.data,
        });
      } else {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: response.message || "Failed to create task",
        });
      }
    } catch (error: any) {
      dispatch({
        type: "LOAD_TASKS_FAILURE",
        payload: error.message || "Failed to create task",
      });
    }
  }, []);

  const updateTask = useCallback(
    async (id: string, updates: UpdateTaskRequest) => {
      try {
        dispatch({ type: "LOAD_TASKS_START" });
        const response = await tasksAPI.updateTask(id, updates);

        if (response.success && response.data) {
          dispatch({
            type: "UPDATE_TASK_SUCCESS",
            payload: response.data,
          });
        } else {
          dispatch({
            type: "LOAD_TASKS_FAILURE",
            payload: response.message || "Failed to update task",
          });
        }
      } catch (error: any) {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: error.message || "Failed to update task",
        });
      }
    },
    []
  );

  const deleteTask = useCallback(async (id: string) => {
    try {
      dispatch({ type: "LOAD_TASKS_START" });
      const response = await tasksAPI.deleteTask(id);

      if (response.success) {
        dispatch({
          type: "DELETE_TASK_SUCCESS",
          payload: id,
        });
      } else {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: response.message || "Failed to delete task",
        });
      }
    } catch (error: any) {
      dispatch({
        type: "LOAD_TASKS_FAILURE",
        payload: error.message || "Failed to delete task",
      });
    }
  }, []);

  const loadMyTasks = useCallback(async () => {
    try {
      dispatch({ type: "LOAD_TASKS_START" });
      const response = await tasksAPI.getMyTasks();

      if (response.success && response.data) {
        dispatch({
          type: "LOAD_MY_TASKS_SUCCESS",
          payload: response.data,
        });
      } else {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: response.message || "Failed to load your tasks",
        });
      }
    } catch (error: any) {
      dispatch({
        type: "LOAD_TASKS_FAILURE",
        payload: error.message || "Failed to load your tasks",
      });
    }
  }, []);

  const completeTask = useCallback(async (id: string) => {
    try {
      dispatch({ type: "LOAD_TASKS_START" });
      const response = await tasksAPI.completeTask(id);

      if (response.success && response.data) {
        dispatch({
          type: "UPDATE_TASK_SUCCESS",
          payload: response.data,
        });
      } else {
        dispatch({
          type: "LOAD_TASKS_FAILURE",
          payload: response.message || "Failed to complete task",
        });
      }
    } catch (error: any) {
      dispatch({
        type: "LOAD_TASKS_FAILURE",
        payload: error.message || "Failed to complete task",
      });
    }
  }, []);

  const setFilters = useCallback((filters: Partial<TaskState["filters"]>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const clearCurrentTask = useCallback(() => {
    dispatch({ type: "CLEAR_CURRENT_TASK" });
  }, []);

  return (
    <TaskContext.Provider
      value={{
        ...state,
        loadTasks,
        loadTask,
        createTask,
        updateTask,
        deleteTask,
        loadMyTasks,
        completeTask,
        setFilters,
        clearError,
        clearCurrentTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
