import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';


/**
 * Custom styles for the user's selected color.
 */
const ColoredDiv = styled.div`
  background-color: ${props => props.rgba};
  height: 20px;
  width: 20px;
  display: inline-block;
  vertical-align: middle;
  margin-bottom: 3px;
`

/**
 * Custom styles for the displayed text.
 */
const StyledText = styled.div`
  font-size: 15px;
  font-family: Arial, Helvetica, sans-serif;
`

/**
 * Custom styles for the overall container with vertically stacked elements and margins.
 */
const FlexContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;


  & > * {
    margin: 10px;
  }
`

/**
 * Custom styles for the hidden image.
 */
const HiddenImage = styled.img`
  display: none;
`

/**
 * File-select field.
 * @param {function} getFile File selection callback function.
 */
function FileInput({ getFile }) {
  return (
    <input type="file" onChange={(e) => getFile(e)} />
  );
}

/**
 * Description text.
 * @param {string} file URL for the uploaded image.
 */
function SelectColorText({ file }) {
  if (!file) return null;
  return (
    <StyledText>Select a color from your image.</StyledText>
  );
}

/**
 * Description text with the user's selected color.
 * @param {string} rgba RGBA color value representing the user's selected color.
 */
function SelectedColor({ rgba }) {
  if (!rgba) return null;
  return (
    <StyledText>Selected color: <ColoredDiv rgba={rgba} /></StyledText>
  );
}

/**
 * Calculation to determine if two rgb color values are similar enough to be visibly seen as the same color.
 * @param {number} r1 Red from the first RGBA color value.
 * @param {number} r2 Red from the second RGBA color value.
 * @param {number} g1 Green from the first RGBA color value.
 * @param {number} g2 Green from the second RGBA color value.
 * @param {number} b1 Blue from the first RGBA color value.
 * @param {number} b2 Blue from the second RGBA color value.
 */
function isSimilarColor(r1, r2, g1, g2, b1, b2) {
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)) < 30; // This value can be adjusted. The higher the value, the wider the range of "similarity".
}

/**
 * Determines if the user's uploaded image is a valid image file.
 * @param {string} url URL for the uploaded image.
 * @param {function} callback Image callback function.
 */
function isValidImage(url, callback) {
  const image = new Image();
  image.onload = function() {
    callback(true);
  }
  image.onerror = function() {
    callback(false);
  }
  image.src = url;
}

/**
 * Clears the canvas.
 * @param {object} canvas Canvas element for the user's image to be drawn on.
 * @param {number} imageWidth The width of the user's image, if available.
 * @param {number} imageHeight The height of the user's image, if available.
 */
function clearCanvas(canvas, imageWidth, imageHeight) {
  const context = canvas.getContext('2d');
  if (imageWidth && imageHeight) {
    context.clearRect(0, 0, imageWidth, imageHeight);
  }
}

/**
 * Main component.
 */
function App() {
  const [file, setFile] = useState('');
  const [rgba, setRgba] = useState('');
  const [r, setR] = useState('');
  const [g, setG] = useState('');
  const [b, setB] = useState('');
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const updatedCanvasRef = useRef(null);
  const invalidFileErrorMsg = "Oops, that doesn't look like a valid image file. Please try again.";
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  /**
  * Checks if an image is selected and whether it is a valid image.
  * @param {object} e Event triggered when the file-select field is changed.
  */
  const getFile = e => {
    if (e.target.files[0]) {
      const uploadFile = URL.createObjectURL(e.target.files[0]);
      isValidImage(uploadFile, function(isValid) {
        if (isValid) {
          setFile(uploadFile);
        } else {
          clearCanvas(canvasRef.current, imageWidth, imageHeight);
          setFile('');
          setRgba('');
          alert(invalidFileErrorMsg);
        }
      });
    } else {
      clearCanvas(canvasRef.current, imageWidth, imageHeight);
      setFile('');
      setRgba('');
      alert(invalidFileErrorMsg);
    }
  }

  /**
  * Updates the state of the image's width and height.
  */
  const setImageHeightWidth = () => {
    const image = imageRef.current;
    setImageWidth(image.width);
    setImageHeight(image.height);
  }

  /**
  * Draws the user's image into the canvas.
  */
  const updateCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
  }

  /**
  * Determines the rgba color value of the clicked pixel and updates the state of the RGBA color values.
  * @param {object} e Event triggered when the user clicks on a pixel in the canvas.
  */
  const getColor = e => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixel = context.getImageData(x, y, 1, 1);
    const data = pixel.data;
    const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3]/255)})`;
    setR(data[0]);
    setG(data[1]);
    setB(data[2]);
    setRgba(rgba);
  }

  /**
  * Draws a new canvas with a grayscale version of all pixels from the original canvas, except for the pixels that have a similar color to the user's selected color.
  */
  const isolateColor = () => {
    if (r === "" && g === "" && b === "") return;
    const oldCanvas = canvasRef.current;
    const oldContext = oldCanvas.getContext('2d');
    const pixel = oldContext.getImageData(0, 0, oldCanvas.width, oldCanvas.height);
    let data = pixel.data;
    for (let i = 0; i < data.length; i += 4) {
      if (!isSimilarColor(r, data[i], g, data[i + 1], b, data[i + 2])) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
      }
    }
    const newCanvas = updatedCanvasRef.current;
    newCanvas.width = imageWidth;
    newCanvas.height = imageHeight;
    const newContext = newCanvas.getContext('2d');
    newContext.putImageData(pixel, 0, 0);
  }

  useEffect(() => {
    updateCanvas();
    isolateColor();
  });

  return (
    <div>
      <FlexContainer>
        <StyledText>Choose an image: </StyledText>
        <FileInput getFile={getFile} />
        <canvas ref={canvasRef} onClick={(e) => getColor(e)} />
        <HiddenImage ref={imageRef} src={file} alt="user-upload" onLoad={setImageHeightWidth} />
        <SelectColorText file={file} />
        <SelectedColor rgba={rgba} />
        <canvas ref={updatedCanvasRef} />
      </FlexContainer>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
