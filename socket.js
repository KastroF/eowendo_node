let io;

module.exports = {
  setIO: (ioInstance) => {
    io = ioInstance;
  },
  getIO: () => io,
};
