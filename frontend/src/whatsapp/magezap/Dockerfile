# Stage 0: instalar Node + PNPM via Corepack
FROM node:23-alpine AS node

# Stage 1: pre-build (Ruby + dependências nativas)
FROM ruby:3.4.3-alpine AS pre-builder

ARG NODE_VERSION="23.7.0"
ARG PNPM_VERSION="10.2.0"
ENV NODE_VERSION=${NODE_VERSION}
ENV PNPM_VERSION=${PNPM_VERSION}

ARG BUNDLE_WITHOUT="development:test"
ENV BUNDLE_WITHOUT ${BUNDLE_WITHOUT}
ENV BUNDLER_VERSION=2.5.11

ARG RAILS_ENV=production
ENV RAILS_ENV ${RAILS_ENV}

ARG NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider"
ENV NODE_OPTIONS=${NODE_OPTIONS}

RUN apk update && apk add --no-cache \
  build-base \
  postgresql-dev \
  git \
  curl \
  tzdata \
  linux-headers \
  ruby-dev \
  openssl-dev \
  imagemagick-dev \
  vips-dev \
  xz \
  && mkdir -p /var/app \
  && gem install bundler

COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
  && npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Copiar apenas Gemfile para cache eficiente
COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3 --path vendor/bundle --binstubs --without development test

# Agora copia o projeto inteiro
COPY . .

RUN if [ "$RAILS_ENV" = "production" ]; then \
      SECRET_KEY_BASE=precompile_placeholder RAILS_LOG_TO_STDOUT=enabled \
      bundle exec rake assets:precompile --trace; \
      rm -rf spec node_modules tmp/cache; \
    fi

RUN git rev-parse HEAD > /app/.git_sha 2>/dev/null || echo "no-git-sha" > /app/.git_sha
RUN rm -rf .git .gitignore

# Stage final: produção
FROM ruby:3.4.3-alpine

ARG PNPM_VERSION="10.2.0"
ENV PNPM_VERSION=${PNPM_VERSION}

ARG RAILS_ENV=production
ENV RAILS_ENV ${RAILS_ENV}

RUN apk update && apk add --no-cache \
  build-base \
  postgresql-client \
  imagemagick \
  vips \
  git \
  tzdata \
  openssl \
  && gem install bundler

COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules

WORKDIR /app

COPY --from=pre-builder /app /app

# Ajustar PATH para bundler e binstubs
ENV PATH="/app/bin:/app/vendor/bundle/ruby/3.4.0/bin:$PATH"

EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
