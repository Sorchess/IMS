# Backend


## Issue RSA private key + public key pair

```shell
# Generate an RSA private key, of size 2048
openssl genrsa -out jwt-private.pem 2048
```

```shell
# Extract the public key from the key pair, which can be used in a certificate
openssl rsa -in jwt-private.pem -outform PEM -pubout -out jwt-public.pem
```

## Docker debugging

```
docker compose up -d
```

```
docker compose stop; docker compose rm -f; docker image rm ims-app; docker image rm ims-emails-worker;
```

# Resources:
- gitignore for Python https://github.com/github/gitignore/blob/main/Python.gitignore
- FastAPI events https://fastapi.tiangolo.com/advanced/events/
- FastAPI lifespan events https://fastapi.tiangolo.com/advanced/events/#lifespan-function
- SQLAlchemy create engine https://docs.sqlalchemy.org/en/20/core/engines.html#sqlalchemy.create_engine
- Python typing https://docs.python.org/3/library/typing.html
- pydantic settings dotenv https://docs.pydantic.dev/latest/concepts/pydantic_settings/#dotenv-env-support
- pydantic settings env variables https://docs.pydantic.dev/latest/concepts/pydantic_settings/#parsing-environment-variable-values
- case converter https://github.com/mahenzon/ri-sdk-python-wrapper/blob/master/ri_sdk_codegen/utils/case_converter.py
- SQLAlchemy constraint naming conventions https://docs.sqlalchemy.org/en/20/core/constraints.html#constraint-naming-conventions
- Alembic cookbook https://alembic.sqlalchemy.org/en/latest/cookbook.html
- Alembic naming conventions https://alembic.sqlalchemy.org/en/latest/naming.html#integration-of-naming-conventions-into-operations-autogenerate
- Alembic + asyncio recipe https://alembic.sqlalchemy.org/en/latest/cookbook.html#using-asyncio-with-alembic
- orjson https://github.com/ijl/orjson
- FastAPI ORJSONResponse https://fastapi.tiangolo.com/advanced/custom-response/#use-orjsonresponse