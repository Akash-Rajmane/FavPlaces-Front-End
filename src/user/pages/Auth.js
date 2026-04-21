import React, { useState, useContext } from "react";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import ImageUpload from "../../shared/components/FormElements/ImageUpload";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import {
  VALIDATOR_EMAIL,
  VALIDATOR_MINLENGTH,
  VALIDATOR_REQUIRE,
} from "../../shared/util/validators";
import useForm from "../../shared/hooks/form-hook";
import useHttpClient from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import "./Auth.css";

const Auth = () => {
  const auth = useContext(AuthContext);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [formState, inputHandler, setFormData] = useForm(
    {
      email: {
        value: "",
        isValid: false,
      },
      password: {
        value: "",
        isValid: false,
      },
    },
    false,
  );

  const switchModeHandler = () => {
    if (!isLoginMode) {
      setFormData(
        {
          ...formState.inputs,
          name: undefined,
          image: undefined,
        },
        formState.inputs.email.isValid && formState.inputs.password.isValid,
      );
    } else {
      setFormData(
        {
          ...formState.inputs,
          name: {
            value: "",
            isValid: false,
          },
          image: {
            value: null,
            isValid: false,
          },
        },
        false,
      );
    }
    setIsLoginMode((prevMode) => !prevMode);
  };

  const authSubmitHandler = async (event) => {
    event.preventDefault();

    if (isLoginMode) {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/users/login`,
          "POST",
          JSON.stringify({
            email: formState.inputs.email.value,
            password: formState.inputs.password.value,
          }),
          {
            "Content-Type": "application/json",
          },
        );

        auth.login(responseData.userId, responseData.token, {
          name: responseData.name,
          email: responseData.email,
          image: responseData.image,
        });
      } catch (err) {}
    } else {
      try {
        const formData = new FormData();
        formData.append("email", formState.inputs.email.value);
        formData.append("name", formState.inputs.name.value);
        formData.append("password", formState.inputs.password.value);
        formData.append("image", formState.inputs.image.value);

        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/users/signup`,
          "POST",
          formData,
        );

        auth.login(responseData.userId, responseData.token, {
          name: responseData.name,
          email: responseData.email,
          image: responseData.image,
        });
      } catch (err) {}
    }
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <div className="auth-page">
        <div className={`auth__visual ${isLoginMode ? 'login-mode' : 'signup-mode'}`}>
          <div className="auth__visual-content">
            <h1>{isLoginMode ? "Welcome back." : "Join FavPlaces."}</h1>
            <p>{isLoginMode ? "Discover new destinations." : "Share your favorite hidden gems with the world."}</p>
          </div>
        </div>
        
        <div className="auth__form-container">
          <div className="auth__form-card">
            {isLoading && <LoadingSpinner asOverlay />}
            <h2>{isLoginMode ? "Sign In" : "Create Account"}</h2>
            <form onSubmit={authSubmitHandler}>
              {!isLoginMode && (
                <div className="auth__slide-in">
                  <Input
                    element="input"
                    id="name"
                    type="text"
                    label="Your Name"
                    validators={[VALIDATOR_REQUIRE()]}
                    errorText="Please enter a valid name"
                    onInput={inputHandler}
                  />
                  <ImageUpload id="image" center onInput={inputHandler} />
                </div>
              )}
              <Input
                element="input"
                id="email"
                type="email"
                label="E-mail"
                validators={[VALIDATOR_EMAIL()]}
                errorText="Please enter a valid email address."
                onInput={inputHandler}
              />
              <Input
                element="input"
                id="password"
                type="password"
                label="Password"
                validators={[VALIDATOR_MINLENGTH(8)]}
                errorText="Please enter a valid password, at least 8 characters."
                onInput={inputHandler}
              />
              <Button type="submit" disabled={!formState.isValid} className="auth__submit-btn">
                {isLoginMode ? "SIGN IN" : "SIGN UP"}
              </Button>
            </form>
            <div className="auth__switch">
              <span>{isLoginMode ? "Don't have an account?" : "Already have an account?"}</span>
              <button className="auth__switch-btn" type="button" onClick={switchModeHandler}>
                {isLoginMode ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Auth;
