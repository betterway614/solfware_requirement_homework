import { configureStore } from '@reduxjs/toolkit';

// 创建一个默认的 reducer 函数，修复 "Store does not have a valid reducer" 错误
const defaultReducer = (state = {}) => state;

const store = configureStore({
  reducer: defaultReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
