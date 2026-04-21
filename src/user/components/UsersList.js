import React from "react";
import UserItem from "./UserItem";
import Card from "../../shared/components/UIElements/Card";
import "./UsersList.css";

import Masonry from "react-masonry-css";

const UsersList = (props) => {
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    768: 2,
    500: 1
  };

  if (props.items.length === 0) {
    return (
      <div className="center">
        <Card>
          <h2>No users found.</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="users-gallery-wall">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="users-masonry-grid"
        columnClassName="users-masonry-grid_column"
      >
        {props.items.map((user) => (
          <UserItem
            key={user._id}
            id={user._id}
            image={user.image}
            name={user.name}
            placeCount={user.places.length}
            followStatus={user.followStatus}
          />
        ))}
      </Masonry>
    </div>
  );
};

export default UsersList;
