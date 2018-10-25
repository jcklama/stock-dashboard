import React from "react";
import ReactDOM from "react-dom";

const element = <h1>Hello World</h1>;
// this will be compiled down to React.createElement that is created from the React module
console.log(element);
ReactDOM.render(element, document.getElementById("root"));
