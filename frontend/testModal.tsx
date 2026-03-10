import React from 'react';
import { renderToString } from 'react-dom/server';
import UserModal from './src/features/admin/UserModal';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './src/app/apiSlice';

const store = configureStore({
  reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
  middleware: (g) => g().concat(apiSlice.middleware)
});

try {
  const html = renderToString(
    <Provider store={store}>
      <UserModal isOpen={true} onClose={() => {}} userToEdit={{ id: '1', name: 'John Doe', role: 'doctor', email: 'doc@example.com', phone: '123' } as any} />
    </Provider>
  );
  console.log("RENDER SUCCESS.");
  console.log("Length:", html.length);
  // if you want to see if it just rendered the word Doctor, log the whole thing:
  if (html.length < 1000) {
     console.log(html);
  }
} catch(e) {
  console.error("RENDER CRASHED:", e);
}
