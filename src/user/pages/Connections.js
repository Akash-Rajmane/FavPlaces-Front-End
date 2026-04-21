import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import Avatar from "../../shared/components/UIElements/Avatar";
import Button from "../../shared/components/FormElements/Button";
import Card from "../../shared/components/UIElements/Card";
import { Link } from "react-router-dom";
import "./Connections.css";

const Connections = () => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [networkData, setNetworkData] = useState({ followers: [], following: [], suggestions: [] });
  const [activeTab, setActiveTab] = useState("suggestions");

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/follow/network`,
          "GET",
          null,
          { Authorization: "Bearer " + auth.token }
        );
        if (responseData) {
          setNetworkData(responseData);
        }
      } catch (err) {}
    };
    if (auth.token) {
      fetchNetwork();
    }
  }, [sendRequest, auth.token]);

  const followHandler = async (userId) => {
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/follow/request`,
        "POST",
        JSON.stringify({ userId }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );
      setNetworkData(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(u => u._id !== userId)
      }));
    } catch (err) {}
  };

  const renderUsers = (users, isSuggestion = false) => {
    if (!users || users.length === 0) {
      return <p className="connections-empty">No users found in this section.</p>;
    }
    return (
      <ul className="connections-list">
        {users.map(user => (
          <li key={user._id} className="connection-item">
            <Card className="connection-item__content">
              <Link to={`/${user._id}/places`} className="connection-item__link">
                <div className="connection-item__image">
                  <Avatar image={user.image} alt={user.name} />
                </div>
                <div className="connection-item__info">
                  <h2>{user.name}</h2>
                  <h3>{user.places?.length || 0} Places</h3>
                </div>
              </Link>
              {isSuggestion && (
                <div className="connection-item__actions">
                  <Button onClick={() => followHandler(user._id)}>Follow</Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className="center" style={{ marginTop: "5rem" }}>
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && (
        <div className="connections-page">
          <div className="connections-header">
            <h1>Your Network</h1>
            <div className="connections-tabs">
              <button className={activeTab === 'suggestions' ? 'active' : ''} onClick={() => setActiveTab('suggestions')}>Suggestions</button>
              <button className={activeTab === 'followers' ? 'active' : ''} onClick={() => setActiveTab('followers')}>Followers ({networkData.followers?.length || 0})</button>
              <button className={activeTab === 'following' ? 'active' : ''} onClick={() => setActiveTab('following')}>Following ({networkData.following?.length || 0})</button>
            </div>
          </div>
          <div className="connections-content">
            {activeTab === 'suggestions' && renderUsers(networkData.suggestions, true)}
            {activeTab === 'followers' && renderUsers(networkData.followers)}
            {activeTab === 'following' && renderUsers(networkData.following)}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Connections;
