import React, { useEffect, useState, useContext } from "react";

import UsersList from "../components/UsersList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import useHttpClient from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";

const Users = () => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const auth = useContext(AuthContext);

  const [loadedUsers, setLoadedUsers] = useState();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const headers = {};

        // ✅ Add token only if user is logged in
        if (auth.token) {
          headers.Authorization = "Bearer " + auth.token;
        }

        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/users`,
          "GET",
          null,
          headers
        );

        setLoadedUsers(responseData.users);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUsers();
  }, [sendRequest, auth.token]);

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
    </React.Fragment>
  );
};

export default Users;
