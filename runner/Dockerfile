FROM docker.io/cloudflare/sandbox:next-python

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash build-essential default-jdk-headless erlang-base erlang-dev golang-go \
    lua5.4 perl ruby rustc cargo sqlite3 nodejs npm \
  && rm -rf /var/lib/apt/lists/*
RUN npm install --global typescript@4.9.5
COPY src/sqlite_runner.py /usr/local/bin/darkwave-sqlite.py
RUN chmod 0555 /usr/local/bin/darkwave-sqlite.py
WORKDIR /workspace
CMD ["sleep", "infinity"]
