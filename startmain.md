# MetroSeat 프로젝트 안내

이 저장소는 Cloudflare의 [vinext](https://github.com/cloudflare/vinext)를 기반으로 한 전체 스택 스타터 템플릿입니다. 선택적으로 Cloudflare D1과 Drizzle ORM을 사용할 수 있으며, 로컬 개발과 배포 준비를 쉽게 도와줍니다.

## 1. 필수 조건

- Node.js `>=22.13.0`
- npm 또는 pnpm
- Git (프로젝트 클론 시 필요)

> 이 프로젝트는 `package.json`에 npm 스크립트를 정의하고 있으며, `pnpm-lock.yaml` 파일도 포함되어 있으므로 `pnpm`을 사용하면 더 안정적으로 설치할 수 있습니다.

## 2. 설치 및 실행 준비

### 2.1 저장소 루트로 이동

```bash
cd /Users/rankerblond/Desktop/ProJect/MetroSeat
```

### 2.2 의존성 설치

```bash
npm install
```

`pnpm`이 설치되어 있다면 다음 명령도 사용할 수 있습니다.

```bash
pnpm install
```

### 2.3 환경 변수

현재 프로젝트는 `package.json` 스크립트에서 `WRANGLER_LOG_PATH=.wrangler/wrangler.log`를 자동으로 설정합니다. 별도 환경 변수를 추가로 설정할 필요는 없지만, Cloudflare Sites 또는 D1을 사용할 때는 관련 인증 정보가 필요할 수 있습니다.

## 3. 개발 서버 실행

```bash
npm run dev
```

실행 후 브라우저에서 다음 주소를 엽니다.

```bash
http://localhost:5173
```

- 개발 모드에서는 파일 변경 시 자동으로 페이지가 갱신됩니다.
- 오류가 발생하면 터미널 로그를 확인하세요.

## 4. 빌드 및 배포 준비

```bash
npm run build
```

- 이 명령은 실제 배포용 빌드 결과를 생성합니다.
- 빌드에 실패하면 패키지 버전이나 코드 오류를 확인해야 합니다.

배포를 위해 로컬 서버를 확인하려면 아래 명령을 사용할 수 있습니다.

```bash
npm run start
```

## 5. 테스트와 린트

### 5.1 테스트 실행

```bash
npm test
```

- `pnpm run build`를 수행한 뒤, `tests/rendered-html.test.mjs` 파일에 정의된 렌더링 테스트를 실행합니다.

### 5.2 린트 실행

```bash
npm run lint
```

- `eslint`를 사용해서 코드 스타일과 문법 문제를 검사합니다.
- `dist`와 `.next` 폴더는 검사 대상에서 제외됩니다.

## 6. Drizzle 마이그레이션 생성

`db/schema.ts` 파일에 스키마를 변경한 뒤, 마이그레이션 파일을 생성하려면 아래 명령을 실행합니다.

```bash
npm run db:generate
```

- `drizzle-kit generate`를 실행하여 마이그레이션 파일을 만듭니다.
- 생성된 마이그레이션은 `drizzle/` 또는 관련 폴더에 저장될 수 있습니다.

## 7. 주요 파일 및 폴더 설명

- `app/`
  - 실제 웹 앱 소스코드가 위치하는 폴더입니다.
  - 페이지, 컴포넌트, API 라우트 등이 포함됩니다.
- `db/schema.ts`
  - Drizzle ORM 스키마 정의 파일입니다.
- `drizzle.config.ts`
  - Drizzle 마이그레이션 및 데이터베이스 관련 설정입니다.
- `vite.config.ts`
  - 로컬 개발 환경에서 Vite와 Cloudflare 바인딩을 설정합니다.
- `.hosting/hosting.json`
  - Cloudflare Sites D1과 R2 바인딩 정보를 선언하는 파일입니다.
- `examples/d1/`
  - D1 데이터베이스 예제 코드가 포함된 디렉터리입니다.
- `tests/`
  - 렌더링 및 동작 검증을 위한 테스트 파일들이 들어 있습니다.

## 8. 개발 팁

- `app/` 디렉터리에서 UI 또는 페이지를 수정하세요.
- 개발 중에는 `npm run dev`를 켜둔 상태에서 빠르게 결과를 확인할 수 있습니다.
- 변경 사항 적용 후 브라우저가 자동으로 새로고침되지 않으면, 터미널에서 서버 로그를 확인하세요.
- `npm run build`는 실제 배포 전 필수 검증 단계입니다.

## 9. 문제 해결

### 9.1 설치 오류 발생 시

- Node.js 버전이 `22.13.0` 이상인지 확인하세요.
- `npm install` 대신 `pnpm install`을 시도해보세요.
- 캐시 문제일 경우 `npm cache clean --force` 또는 `pnpm store prune`을 실행합니다.

### 9.2 개발 서버가 열리지 않을 때

- 이미 `5173` 포트를 사용하는 프로세스가 있는지 확인합니다.
- 포트 충돌이 있으면 `npm run dev` 로그에서 대체 주소를 찾거나, 포트를 바꿔 실행합니다.

### 9.3 빌드 실패 시

- 터미널 출력에 표시된 오류 메시지를 먼저 확인합니다.
- 모듈 버전 충돌이나 `typescript` 타입 오류가 있는지 확인합니다.
- 필요하면 `node_modules`를 삭제하고 다시 설치합니다.

## 10. 참고 자료

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
