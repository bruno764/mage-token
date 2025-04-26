# Stage 0: instalar Node + PNPM via Corepack
FROM node:23-alpine AS node

# Stage 1: pre-build (Ruby + dependências nativas)
FROM ruby:3.3.3-alpine3.19 AS pre-builder

ARG NODE_VERSION="23.7.0"
ARG PNPM_VERSION="10.2.0"
ENV NODE_VERSION=${NODE_VERSION}
ENV PNPM_VERSION=${PNPM_VERSION}

# Remover gems de dev/test em produção
ARG BUNDLE_WITHOUT="development:test"
ENV BUNDLE_WITHOUT ${BUNDLE_WITHOUT}
ENV BUNDLER_VERSION=2.5.11

# Configurações Rails
ARG RAILS_SERVE_STATIC_FILES=true
ENV RAILS_SERVE_STATIC_FILES ${RAILS_SERVE_STATIC_FILES}
ARG RAILS_ENV=production
ENV RAILS_ENV ${RAILS_ENV}

# Mais memória pro Node
ARG NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider"
ENV NODE_OPTIONS ${NODE_OPTIONS}



# Instala runtime mínimo de SO e bundler
RUN apk update && apk add --no-cache \
  openssl \
  tar \
  build-base \
  tzdata \
  postgresql-dev \
  postgresql-client \
  git \
  curl \
  xz \
  && mkdir -p /var/app \
  && gem install bundler

# Copia Node e PNPM do stage anterior
COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Instala PNPM globalmente
RUN npm install -g pnpm@${PNPM_VERSION}

# Configura variável de ambiente para PNPM
RUN echo 'export PNPM_HOME="/root/.local/share/pnpm"' >> /root/.shrc \
  && echo 'export PATH="$PNPM_HOME:$PATH"' >> /root/.shrc \
  && export PNPM_HOME="/root/.local/share/pnpm" \
  && export PATH="$PNPM_HOME:$PATH" \
  && pnpm --version

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# 1) copia apenas as definições de gems
COPY Gemfile Gemfile.lock ./

# 2) configura o Bundler para instalar TUDO em vendor/bundle E gerar os binstubs em bin/
RUN bundle config set --local path 'vendor/bundle'       \
 && bundle config set --local bin 'bin'                  \
 && bundle config set --local without 'development test' \
 && bundle install --jobs 4 --retry 3

# garante que os executáveis do binstub e vendor/bundle fiquem no PATH
ENV PATH="/app/bin:/app/vendor/bundle/ruby/3.3.0/bin:$PATH"

# Instala dependências nativas (incluindo vips via edge/community)
RUN apk update && apk add --no-cache \
    build-base musl ruby-full ruby-dev gcc make musl-dev \
    openssl openssl-dev g++ linux-headers xz
RUN apk add --no-cache \
    --repository http://dl-cdn.alpinelinux.org/alpine/edge/community \
    vips

# Instala pacotes JS via PNPM
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copia todo o código
COPY . /app

# Diretório de logs para não falhar se LOG_TO_STDOUT for false
RUN mkdir -p /app/log

# Etapa de pré-compilação de assets (exibe versões e usa --trace)
RUN if [ "$RAILS_ENV" = "production" ]; then \
      echo "→ Node: $(node --version)"; \
      echo "→ PNPM: $(pnpm --version)"; \
      SECRET_KEY_BASE=precompile_placeholder \
        RAILS_LOG_TO_STDOUT=enabled \
        bundle exec rake assets:precompile --trace; \
      rm -rf spec node_modules tmp/cache; \
    fi

# Grava o SHA do commit (fallback quando não houver .git)
RUN git rev-parse HEAD > /app/.git_sha 2>/dev/null || \
    echo "no-git-sha" > /app/.git_sha

# Limpa arquivos de Git e .gitignore
RUN rm -rf .git \
  && rm .gitignore


# Stage final: imagem enxuta de produção
FROM ruby:3.3.3-alpine3.19

ARG NODE_VERSION="23.7.0"
ARG PNPM_VERSION="10.2.0"
ENV NODE_VERSION=${NODE_VERSION}
ENV PNPM_VERSION=${PNPM_VERSION}

ARG BUNDLE_WITHOUT="development:test"
ENV BUNDLE_WITHOUT ${BUNDLE_WITHOUT}
ENV BUNDLER_VERSION=2.5.11

ARG EXECJS_RUNTIME="Disabled"
ENV EXECJS_RUNTIME ${EXECJS_RUNTIME}

ARG RAILS_SERVE_STATIC_FILES=true
ENV RAILS_SERVE_STATIC_FILES ${RAILS_SERVE_STATIC_FILES}

ARG BUNDLE_FORCE_RUBY_PLATFORM=1
ENV BUNDLE_FORCE_RUBY_PLATFORM ${BUNDLE_FORCE_RUBY_PLATFORM}

ARG RAILS_ENV=production
ENV RAILS_ENV ${RAILS_ENV}


# Instala runtime de produção
RUN apk update && apk add --no-cache \
  build-base \
  openssl \
  tzdata \
  postgresql-client \
  imagemagick \
  git \
  vips \
  && gem install bundler

# Copia Node/PNPM para ambientes de staging/dev (se necessário)
COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules

RUN if [ "$RAILS_ENV" != "production" ]; then \
      apk add --no-cache curl \
      && ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
      && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
      && npm install -g pnpm@${PNPM_VERSION} \
      && pnpm --version; \
    fi

# Copia app pré-compilados do pre-builder
COPY --from=pre-builder /app /app

# Copia .git_sha
COPY --from=pre-builder /app/.git_sha /app/.git_sha

WORKDIR /app
# garante que o Bundler use /app/.bundle como local de config
ENV BUNDLE_APP_CONFIG="/app/.bundle"
RUN mkdir -p /app/.bundle


# Garante permissão de execução para os binstubs Rails
RUN chmod +x /app/bin/rails /app/bin/rake

EXPOSE 3000

CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]

