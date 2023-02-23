import Server from "./server.js";

export const onMessage = (data, _, ws) => {
  const branch = String.fromCharCode(...data).toString();

  console.log("Compile bytecode of: " + branch);

  ws.send(`Insourced Bytecode (${branch}): []`);
};

export const insource = () => {};

// Store the frequency of x request

// With high average latency & high frequency of a specific resource -> invoke insourcing!
