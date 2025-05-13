import { Navigate, Route, Routes } from "react-router";
import { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import SocketProvider from "./components/SocketProvider.jsx";
import { abortChatConnection } from "./lib/api";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;

  if (isLoading) return <PageLoader />;

  return (
    <div className="h-screen" data-theme={theme}>
      {isAuthenticated && isOnboarded && (
        <SocketProvider>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated && isOnboarded ? (
                  <Layout showSidebar={true}>
                    <HomePage />
                  </Layout>
                ) : (
                  <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !isAuthenticated ? <SignUpPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
              }
            />
            <Route
              path="/login"
              element={
                !isAuthenticated ? <LoginPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
              }
            />
            <Route
              path="/notifications"
              element={
                isAuthenticated && isOnboarded ? (
                  <Layout showSidebar={true}>
                    <NotificationsPage />
                  </Layout>
                ) : (
                  <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
                )
              }
            />
            <Route
              path="/call/:id"
              element={
                isAuthenticated && isOnboarded ? (
                  <CallPage />
                ) : (
                  <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
                )
              }
            />

            <Route
              path="/chat/:id"
              element={
                isAuthenticated && isOnboarded ? (
                  <Layout showSidebar={false}>
                    <NavigationListener />
                    <ChatPage />
                  </Layout>
                ) : (
                  <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
                )
              }
            />

            <Route
              path="/onboarding"
              element={
                isAuthenticated ? (
                  !isOnboarded ? (
                    <OnboardingPage />
                  ) : (
                    <Navigate to="/" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </SocketProvider>
      )}
      
      {/* Routes for non-authenticated or non-onboarded users */}
      {(!isAuthenticated || !isOnboarded) && (
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated && isOnboarded ? (
                <Layout showSidebar={true}>
                  <HomePage />
                </Layout>
              ) : (
                <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !isAuthenticated ? <SignUpPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
            }
          />
          <Route
            path="/login"
            element={
              !isAuthenticated ? <LoginPage /> : <Navigate to={isOnboarded ? "/" : "/onboarding"} />
            }
          />
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? (
                !isOnboarded ? (
                  <OnboardingPage />
                ) : (
                  <Navigate to="/" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}

      <Toaster />
    </div>
  );
};

// Component to clean up Stream chat resources when navigation happens
const NavigationListener = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Handle navigation changes, especially when leaving chat pages
    const cleanupStreamResources = () => {
      // Only try to clean up if navigating away from chat pages
      if (location.pathname.includes('/chat/')) {
        console.log('Navigating away from chat page, cleaning up resources');
        // Use the centralized cleanup function
        abortChatConnection();
      }
    };
    
    cleanupStreamResources();
    
    // Return cleanup function in case component unmounts
    return () => {
      // Ensure cleanup when component unmounts
      if (location.pathname.includes('/chat/')) {
        abortChatConnection();
      }
    };
  }, [location.pathname]); // Re-run when pathname changes
  
  return null; // This component doesn't render anything
};

export default App;
