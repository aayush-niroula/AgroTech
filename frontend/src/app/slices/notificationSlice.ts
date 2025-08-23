import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NotificationState {
  hasUnread: boolean;
   chatUnreadMap: Record<string, boolean>;
}

const initialState: NotificationState = {
  hasUnread: false,
  chatUnreadMap: {},
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnread(state) {
      state.hasUnread = true;
    },
    clearUnread(state) {
      state.hasUnread = false;
    },
    setChatUnread(state, action: PayloadAction<{ senderId: string }>) {
       console.log("Setting unread for", action.payload.senderId);
      state.chatUnreadMap[action.payload.senderId] = true;
      state.hasUnread = true;
    },
    clearChatUnread(state, action: PayloadAction<{ senderId: string }>) {
      delete state.chatUnreadMap[action.payload.senderId];
      state.hasUnread = Object.keys(state.chatUnreadMap).length > 0;
    },
  },
});

export const { setUnread, clearUnread ,setChatUnread,clearChatUnread} = notificationSlice.actions;
export default notificationSlice.reducer;
