import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import ImageUpload from "../../shared/components/FormElements/ImageUpload";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH,
} from "../../shared/util/validators";
import useForm from "../../shared/hooks/form-hook";
import useHttpClient from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import AIDescriptionPolish from "../../shared/components/UIElements/AIDescriptionPolish";
import AIImageAutofill from "../../shared/components/UIElements/AIImageAutofill";
import "./PlaceForm.css";

const NewPlace = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [formState, inputHandler, setFormData] = useForm(
    {
      title: {
        value: "",
        isValid: false,
      },
      description: {
        value: "",
        isValid: false,
      },
      address: {
        value: "",
        isValid: false,
      },
      image: {
        value: null,
        isvalid: false,
      },
    },
    false
  );

  const autofillAppliedHandler = (aiData) => {
    const updatedInputs = {
      ...formState.inputs,
      title: {
        value: aiData.title || formState.inputs.title.value,
        isValid: !!(aiData.title || formState.inputs.title.value),
      },
      address: {
        value: aiData.address || formState.inputs.address.value,
        isValid: !!(aiData.address || formState.inputs.address.value),
      },
      description: {
        value: aiData.description || formState.inputs.description.value,
        isValid: (aiData.description || formState.inputs.description.value).length >= 5,
      },
    };

    const isFormValid =
      updatedInputs.title.isValid &&
      updatedInputs.address.isValid &&
      updatedInputs.description.isValid &&
      !!formState.inputs.image.value;

    setFormData(updatedInputs, isFormValid);
  };

  const applyPolishedDescriptionHandler = (polishedText) => {
    inputHandler("description", polishedText, polishedText.length >= 5);
  };

  const placeSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", formState.inputs.title.value);
      formData.append("description", formState.inputs.description.value);
      formData.append("address", formState.inputs.address.value);
      formData.append("creator", auth.userId);
      formData.append("image", formState.inputs.image.value);
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/places`,
        "POST",
        formData,
        {
          Authorization: "Bearer " + auth.token,
        }
      );
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <div className="new-place-page">
        <div className="new-place__visual">
          <h1>Catalog a new destination</h1>
          <p>Share your favorite hidden gems, local spots, and scenic views with the community.</p>
        </div>
        <div className="new-place__form-container">
          <form className="place-form" onSubmit={placeSubmitHandler}>
            {isLoading && <LoadingSpinner asOverlay />}
            <h2>Add Place</h2>
            <ImageUpload
              id="image"
              onInput={inputHandler}
              errorText={"Please provide an image"}
              center
            />
            <AIImageAutofill
              imageFile={formState.inputs.image.value}
              token={auth.token}
              onAutofillApplied={autofillAppliedHandler}
            />
            <Input
              id="title"
              element="input"
              type="text"
              label="Title"
              validators={[VALIDATOR_REQUIRE()]}
              errorText="Please enter a valid title."
              onInput={inputHandler}
              value={formState.inputs.title.value}
            />
            <Input
              id="address"
              element="input"
              label="Address"
              validators={[VALIDATOR_REQUIRE()]}
              errorText="Please enter a valid address."
              onInput={inputHandler}
              value={formState.inputs.address.value}
            />
            <Input
              id="description"
              element="textarea"
              rows={6}
              label="Description"
              validators={[VALIDATOR_MINLENGTH(5)]}
              errorText="Please enter a valid description (at least 5 characters)."
              onInput={inputHandler}
              value={formState.inputs.description.value}
            />
            <AIDescriptionPolish
              currentDescription={formState.inputs.description.value}
              placeTitle={formState.inputs.title.value}
              onApplyPolished={applyPolishedDescriptionHandler}
              token={auth.token}
            />
            <div className="form-actions">
              <Button type="button" inverse onClick={() => navigate(-1)}>
                CANCEL
              </Button>
              <Button type="submit" disabled={!formState.isValid}>
                ADD PLACE
              </Button>
            </div>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
};

export default NewPlace;
