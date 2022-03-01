const DEFAULT_PAGE_LIMIT = 0; //Mongo returns all records when set to 0
const DEFAULT_PAGE_NUMBER = 1;

function getPagination(query) {
  //abs() converts neg number to pos and also converts string to number
  const page = Math.abs(query.page) || DEFAULT_PAGE_NUMBER;
  const limit = Math.abs(query.limit) || DEFAULT_PAGE_LIMIT;
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
  }
}

module.exports = {
  getPagination,
}