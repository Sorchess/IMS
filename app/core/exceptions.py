from fastapi import HTTPException


class NabronirovalException(Exception):
    detail = "Unexpected error"

    def __init__(self, *args):
        super().__init__(self.detail, *args)


class NabronirovalHTTPException(HTTPException):
    detail = "Unexpected error"
    status_code = 500

    def __init__(self, *args):
        super().__init__(self.status_code, self.detail, *args)


class ObjectNotFoundException(NabronirovalException):
    detail = "Object not found"


class ObjectAlreadyExistsException(NabronirovalException):
    detail = "Object alredy exists"
