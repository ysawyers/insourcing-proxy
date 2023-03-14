export const insource = (data, _, ws) => {
  const slug = String.fromCharCode(...data).toString();

  console.log("Compile bytecode of: " + slug);

  ws.send(`Insourced Bytecode (${slug}): []`);
};
