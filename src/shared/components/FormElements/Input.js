import React, { useReducer, useEffect } from "react";

import { validate } from "../../util/validators";
import "./Input.css";

const inputReducer = (state, action) => {
  switch (action.type) {
    case "CHANGE":
      return {
        ...state,
        value: action.val,
        isValid: validate(action.val, action.validators),
      };
    case "SET_VALUE":
      return {
        ...state,
        value: action.val,
        isValid: validate(action.val, action.validators),
        isTouched: false,
      };
    case "TOUCH": {
      return {
        ...state,
        isTouched: true,
      };
    }
    default:
      return state;
  }
};

const Input = (props) => {
  const [inputState, dispatch] = useReducer(inputReducer, {
    value: props.initialValue || props.value || "",
    isTouched: false,
    isValid: props.initialValid || false,
  });

  const { id, onInput, value: controlledValue, validators } = props;

  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== inputState.value) {
      dispatch({
        type: "SET_VALUE",
        val: controlledValue,
        validators: validators,
      });
      onInput(id, controlledValue, validate(controlledValue, validators));
    }
  }, [controlledValue, validators, id, onInput, inputState.value]);

  const changeHandler = (event) => {
    const val = event.target.value;
    const isValid = validate(val, props.validators);
    dispatch({
      type: "CHANGE",
      val: val,
      validators: props.validators,
    });
    props.onInput(props.id, val, isValid);
  };

  const touchHandler = () => {
    dispatch({
      type: "TOUCH",
    });
  };

  const element =
    props.element === "input" ? (
      <input
        id={props.id}
        type={props.type}
        placeholder={props.placeholder}
        onChange={changeHandler}
        onBlur={touchHandler}
        value={inputState.value}
      />
    ) : (
      <textarea
        id={props.id}
        rows={props.rows || 3}
        onChange={changeHandler}
        onBlur={touchHandler}
        value={inputState.value}
      />
    );

  return (
    <div
      className={`form-control ${
        !inputState.isValid && inputState.isTouched && "form-control--invalid"
      }`}
    >
      <label htmlFor={props.id}>{props.label}</label>
      {element}
      {!inputState.isValid && inputState.isTouched && <p>{props.errorText}</p>}
    </div>
  );
};

export default Input;
