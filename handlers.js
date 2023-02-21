export const onMessage = (data, _, ws) => {
  // const Mbps = parseInt(String.fromCharCode(...data).toString());
  // // NOTE: Ugly code try to make nicer.
  // try {
  //   ws.userData.entries += 1;
  //   ws.userData.totalSum += Mbps;
  //   console.log("Average Mbps: " + ws.userData.totalSum / ws.userData.entries);
  // } catch (_) {
  //   ws.userData = {
  //     entries: 1,
  //     totalSum: Mbps,
  //   };
  // }
};

export const insource = () => {};

// Store the frequency of x request

// With high average latency & high frequency of a specific resource -> invoke insourcing!
