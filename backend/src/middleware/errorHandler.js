export const errorHandler = (error, _request, response, _next) => {
  console.error(error);

  response.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'An unexpected server error occurred.',
  });
};
