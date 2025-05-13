import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api";
import { useEffect } from "react";
import socket from "../lib/socket";

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false, // auth check
  });

  const user = authUser.data?.user;

  // Connect socket when user is authenticated
  useEffect(() => {
    if (user?._id) {
      if (!socket.connected) {
        socket.connect();
        socket.emit('register', user._id);
      }
    }
  }, [user]);

  return { isLoading: authUser.isLoading, authUser: user };
};
export default useAuthUser;
