let io;

module.exports = (socketIoInstance) => {
  io = socketIoInstance;
};

module.exports.getIo = () => io;

