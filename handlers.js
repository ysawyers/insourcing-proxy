export const insource = (data, _, ws) => {
  const branch = String.fromCharCode(...data).toString();

  console.log("Compile bytecode of: " + branch);

  ws.send(`Insourced Bytecode (${branch}): []`);
};
