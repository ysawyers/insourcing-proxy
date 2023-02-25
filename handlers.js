export const onMessage = (data, _, ws) => {
  const branch = String.fromCharCode(...data).toString();

  console.log("Compile bytecode of: " + branch);

  ws.send(`Insourced Bytecode (${branch}): []`);
};

export const insource = () => {};
