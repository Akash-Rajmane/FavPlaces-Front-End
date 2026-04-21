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
  const [cameraError, setCameraError] = useState(null);
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

  // Separate useEffect for cleaning up the camera stream
  useEffect(() => {
    // Cleanup function to stop the camera when the component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]); // Depend on the stream variable

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

  const takePictureHandler = async () => {
    setCameraError(null);
    setIsTakingPicture(true);
    
    try {
      // 1. More flexible constraints
      const constraints = {
        video: isMobile 
          ? { facingMode: cameraFacingRef.current } // Suggest, don't demand "exact"
          : true,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // 2. Explicitly call play() to ensure the stream starts
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing the camera", err);
      setIsTakingPicture(false);
      
      // 3. Specific error handling
      if (err.name === 'NotAllowedError') {
        setCameraError("Permission denied. Please allow camera access in your browser settings.");
      } else {
        setCameraError("Could not access the camera. It might be in use by another app or timing out.");
      }
    }
  };

  const captureImageHandler = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Safety check: Prevent capture if video stream hasn't initialized or failed
    if (!video || !stream || video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video feed not ready for capture");
      setCameraError("Camera feed is not ready yet. Please wait a second.");
      return;
    }

    const context = canvas.getContext("2d");

    // Set canvas width and height to the video resolution for better quality
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Directly draw the video frame onto the canvas without needing aspect ratio checks
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a Blob (image file)
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create blob from canvas");
        setCameraError("Failed to capture image. Please try again.");
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

      // Set the captured image file and preview
      setFile(capturedfile);
      setPreviewUrl(URL.createObjectURL(capturedfile));
      setIsValid(true);
      setCameraError(null);

      // Pass the file to the onInput function
      props.onInput(props.id, capturedfile, true);

      // Stop the video stream
      stream.getTracks().forEach((track) => track.stop());
    }, "image/png");

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
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline // Critical for iOS/Mobile Safari
              onLoadedMetadata={() => setCameraError(null)} 
              style={{ width: "100%" }} 
            />
          ) : previewUrl ? (
            <img src={previewUrl} alt="Preview" />
          ) : (
            <p>Select an image or take a picture.</p>
          )}
        </div>
        {/* Conditionally render the "Pick Image" and "Take Picture" buttons only if no file is selected & while not taking picture  */}
        {!isTakingPicture && !file && (
          <div className="image-upload__actions">
            <Button type="button" inverse onClick={pickImageHandler}>
              PICK IMAGE
            </Button>
            <Button type="button" inverse onClick={takePictureHandler}>
              TAKE PICTURE
            </Button>
          </div>
        )}
        {/* Show the "Capture" and "Switch Camera" buttons when taking a picture */}
        {isTakingPicture && (
          <div className="image-upload__actions">
            <Button type="button" onClick={captureImageHandler}>
              <img
                src={CameraIcon}
                alt="capture camera"
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
          <div className="image-upload__actions">
            <Button type="button" danger onClick={resetHandler}>
              RESET IMAGE
            </Button>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {!isValid && !cameraError && <p>{props.errorText}</p>}
      {cameraError && <p style={{ color: "#DC2626", fontWeight: "500", marginTop: "0.5rem" }}>{cameraError}</p>}
    </div>
  );
};

export default ImageUpload;
