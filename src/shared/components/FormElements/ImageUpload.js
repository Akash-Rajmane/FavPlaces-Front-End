import React, { useRef, useState, useEffect } from "react";
import Button from "./Button";
import "./ImageUpload.css";
import SwicthCameraIcon from "../../../assets/switch-camera.png";
import CameraIcon from "../../../assets/photo-camera.png";

const ImageUpload = (props) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [stream, setStream] = useState(null);
  const cameraFacingRef = useRef("user"); // default front camera
  const [isMobile, setIsMobile] = useState(false); // State to check if the user is on mobile

  const filePickerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Function to handle backward compatibility for getUserMedia API
  const initializeMedia = () => {
    // Polyfill for older browsers
    if (!("mediaDevices" in navigator)) {
      navigator.mediaDevices = {};
    }

    if (!("getUserMedia" in navigator.mediaDevices)) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        const getUserMedia =
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(
            new Error("getUserMedia is not implemented in this browser!")
          );
        }

        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  };

  useEffect(() => {
    // Check if the user is on a mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    setIsMobile(mobileRegex.test(userAgent));

    initializeMedia();
  }, []);

  // Effect for generating image preview from file input (only if file is a Blob/File)
  useEffect(() => {
    if (!file || typeof file === "string") {
      return; // Skip if the file is already a data URL (string)
    }
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }, [file]);

  // Handle picked file from input
  const pickedHandler = (event) => {
    let pickedFile;
    let fileIsValid = isValid;
    if (event.target.files && event.target.files.length === 1) {
      pickedFile = event.target.files[0];
      setFile(pickedFile);
      setPreviewUrl(null); // Reset preview URL for new file
      setIsValid(true);
      fileIsValid = true;
      setIsTakingPicture(false); // Exit camera mode if picking image
    } else {
      setIsValid(false);
      fileIsValid = false;
    }
    props.onInput(props.id, pickedFile, fileIsValid);
  };

  // Trigger file input click
  const pickImageHandler = () => {
    filePickerRef.current.click();
  };

  // Handle camera access for taking a picture with backward compatibility
  const takePictureHandler = async () => {
    setIsTakingPicture(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: cameraFacingRef.current }, // Select front or back camera
        },
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing the camera", err);
      setIsTakingPicture(false);
    }
  };

  // Capture image from video stream
  const captureImageHandler = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Blob (image file)
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create blob from canvas");
        return;
      }

      // Create a file from the blob with a timestamped name
      const capturedfile = new File(
        [blob],
        `captured-image-${Date.now()}.png`,
        {
          type: "image/png",
        }
      );

      setFile(capturedfile); // Store the file object
      setPreviewUrl(URL.createObjectURL(capturedfile)); // Set preview to the object URL
      setIsValid(true);

      // Pass the file to the onInput function
      props.onInput(props.id, capturedfile, true); // 'true' indicates the file is valid

      // Stop the video stream
      stream.getTracks().forEach((track) => track.stop());
    }, "image/png"); // Specify the image format as PNG

    setIsTakingPicture(false);
  };

  // Reset the current image or camera preview to allow switching between modes
  const resetHandler = () => {
    setFile(null);
    setPreviewUrl(null);
    setIsValid(false);
    setIsTakingPicture(false);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stop the camera stream if it's active
    }
  };

  // Handle camera toggle between front and back
  const toggleCameraHandler = () => {
    // Stop the current camera stream before changing the facing mode
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Toggle camera facing direction and immediately take picture
    cameraFacingRef.current =
      cameraFacingRef.current === "user" ? "environment" : "user";
    // Start the camera again with the new facing mode
    takePictureHandler(); // Ensure this is called after updating the state
  };
  return (
    <div className="form-control">
      <input
        type="file"
        ref={filePickerRef}
        id={props.id}
        style={{ display: "none" }}
        accept=".jpg,.jpeg,.png"
        onChange={pickedHandler}
      />
      <div className={`image-upload ${props.center && "center"}`}>
        <div className="image-upload__preview">
          {/* Show video if taking picture, otherwise show image preview */}
          {isTakingPicture ? (
            <video ref={videoRef} autoPlay style={{ width: "100%" }} />
          ) : previewUrl ? (
            <img src={previewUrl} alt="Preview" />
          ) : (
            <p>Please pick an image or take a picture.</p>
          )}
        </div>
        {/* Conditionally render the "Pick Image" and "Take Picture" buttons only if no file is selected & while not taking picture  */}
        {!isTakingPicture && !file && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <Button type="button" onClick={pickImageHandler}>
              PICK IMAGE
            </Button>
            <Button type="button" onClick={takePictureHandler}>
              TAKE PICTURE
            </Button>
          </div>
        )}
        {/* Show the "Capture" and "Switch Camera" buttons when taking a picture */}
        {isTakingPicture && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <Button type="button" onClick={captureImageHandler}>
              <img
                src={CameraIcon}
                alt="switch camera"
                width={"20px"}
                height={"20px"}
              />
            </Button>
            {isMobile && ( // Only show the switch button if on mobile
              <Button type="button" onClick={toggleCameraHandler}>
                <img
                  src={SwicthCameraIcon}
                  alt="switch camera"
                  width={"20px"}
                  height={"20px"}
                />
              </Button>
            )}
          </div>
        )}
        {file && (
          <Button type="button" onClick={resetHandler}>
            RESET
          </Button>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default ImageUpload;
