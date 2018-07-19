function TypeCaster() {};

TypeCaster.getBool = function(value) {
  if(typeof value === "number") {
    if(value === 0) return false;
    return true;
  }
  else if(typeof value === "boolean") {
    return value;
  }
  else if(typeof value === "string") {
    switch(value) {
      case "true":
      case "enable":
      case "enabled":
      case "yes":
      case "y":
        return true;
        break;
      default:
        return false;
        break;
    }
  }
  return false;
};

module.exports = TypeCaster;
