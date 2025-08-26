import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import authReducer from './slices/authSlice';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { plantApi } from '@/services/plantApi';

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [plantApi.reducerPath]:plantApi.reducer,
  auth: authReducer,

});


const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware as any, plantApi.middleware as any),
});


export const persistor = persistStore(store);


export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
