# FavPlaces (Client)

A modern, full-stack application that allows users to discover, share, and manage their favorite places, complete with maps, images, and vibes. 

### Hosted Link: https://fav-places.vercel.app
### BackEnd Repo: https://github.com/Akash-Rajmane/FavPlaces-Back-End

---

## 🚀 Features

*   **Modern, Premium UI:** A fully responsive, design-system-driven interface featuring glassmorphism, dynamic micro-animations, and a responsive Pinterest-style masonry grid layout.
*   **Authentication & Security:** Secure user signup, login, and logout using JWT authentication.
*   **Place Discovery:** Lightning-fast, full-text semantic search and filtering powered by **Algolia InstantSearch**. Search by name, area, or vibe.
*   **Social Connections & Notifications:** View other users' profiles, see their saved places, follow/connect with them, and receive in-app notifications.
*   **Interactive Maps:** Automatic map rendering using the **Google Maps API** when an address is provided.
*   **Place Management:** Create, edit, and delete personal favorite places with image uploads and customized descriptions.

## 🛠 Technical Stack

*   **Frontend Framework:** ReactJS, HTML5, CSS3 (Custom Design System with CSS variables)
*   **Routing:** React-Router-Dom (v6)
*   **Search Engine:** Algolia & React InstantSearch
*   **Layouts:** React Masonry CSS
*   **Backend API:** NodeJS, ExpressJS, MongoDB (Mongoose)
*   **Integrations:** Google Maps API

---

## 💻 Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites
Make sure you have Node.js installed on your machine. You will also need your own API keys for Google Maps and Algolia to enable map and search functionality.

### Installation

1. Clone the repository and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the `client` directory and add your environment variables:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REACT_APP_ALGOLIA_APP_ID=your_algolia_app_id
   REACT_APP_ALGOLIA_SEARCH_ONLY_KEY=your_algolia_search_only_key
   ```

### Available Scripts

In the project directory, you can run:

#### `npm start`
Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes.

#### `npm run build`
Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes.

---

## 🎨 Design System
The UI has been thoroughly modernized using pure CSS. It utilizes a central variable system in `index.css` to manage themes, colors, border-radii, and typography. No external UI component libraries like Tailwind or Material-UI were used, ensuring a fully custom and lightweight footprint.
