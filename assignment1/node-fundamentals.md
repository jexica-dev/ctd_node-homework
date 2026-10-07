# Node.js Fundamentals

## What is Node.js?
Node.js is an open-source, free tool that allows you to run JavaScript on your computer or a web server, rather than just on a web browser. Node.js, running on a single thread, is a server that excels at communicating with thousands of different users simultaneously.

## How does Node.js differ from running JavaScript in the browser?
Node.js allows you to use JavaScript for server-side scripting, command-line tools, and backend app development. 

## What is the V8 engine, and how does Node use it?
The V8 engine is a high-performance, open-source C++ program that acts as a translator to turn human-readable JavaScript code into machine code that a computer's processor can execute. 

## What are some key use cases for Node.js?
Some Node.js use cases include instant messaging apps, collaborative editing tools, streaming applications, api services, microservices, system monitoring dashboards and tools, and single page applications.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
The main difference between CommonJS and ES Modules is when and how they load your JavaScript files. CommonJS loads files synchronously while the application is running, while ES Modules load files asynchronously before the code even starts executing.

**CommonJS (default in Node.js):**
```js
const API_URL = "https://website.com";
const TIMEOUT = 5000;

function logError(message) {
    console.error(`[Error]: ${message}`);
}

// Grouping everything into a single object to export
module.exports = {
    API_URL,
    TIMEOUT,
    logError
};
```

**ES Modules (supported in modern Node.js):**
```js
// Adding 'export' directly to each individual item
export const API_URL = "https://website.com";
export const TIMEOUT = 5000;

export function logError(message) {
    console.error(`[Error]: ${message}`);
}
``` 