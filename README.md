# Learning Roadmap

개인 콘텐츠를 카테고리별 로드맵으로 보여주기 위한 프로젝트 구조입니다.
배포 대상은 GitHub Pages입니다. 카테고리별 로드맵, 주제 검색, Markdown 노트 보기, 브라우저에 저장하는 학습 완료 체크를 제공합니다.

## 콘텐츠 작성

`content/<category>/<subcategory>/`에 Markdown 학습 노트를 작성합니다.
`roadmaps/<category>.json`에서 노드와 연결 관계를 관리합니다.
현재 모든 글은 작성용 템플릿이며 참고 사이트 본문을 복제하지 않았습니다.
연결선은 개인 학습 순서의 초안입니다.

## 무료 콘텐츠 기준

2026-10-12 Hello Interview의 공개 목차에서 잠금 표시가 없는 글만 등록했습니다.
무료 개요 글 안의 유료 상세 글 링크는 별도 노드로 등록하지 않습니다.
각 노드에 원문 링크, 무료 여부, 확인 날짜를 기록했습니다.
무료 여부는 원문 글을 기준으로 하며 영상, 퀴즈, 실습의 무료 제공을 의미하지 않습니다.
원문 접근 정책이 바뀌면 다시 확인해야 합니다.

분류 및 접근 표시 참고: https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction

## System Design

### 시작하기 (3)

- [Introduction](content/system-design/getting-started/introduction.md)
- [How to Prepare](content/system-design/getting-started/how-to-prepare.md)
- [Delivery Framework](content/system-design/getting-started/delivery.md)

### 기초 개념 (7)

- [Networking Essentials](content/system-design/core-concepts/networking-essentials.md)
- [API Design](content/system-design/core-concepts/api-design.md)
- [Data Modeling](content/system-design/core-concepts/data-modeling.md)
- [Caching](content/system-design/core-concepts/caching.md)
- [Sharding](content/system-design/core-concepts/sharding.md)
- [Consistent Hashing](content/system-design/core-concepts/consistent-hashing.md)
- [CAP Theorem](content/system-design/core-concepts/cap-theorem.md)

### 주요 기술 (7)

- [Redis](content/system-design/key-technologies/redis.md)
- [Elasticsearch](content/system-design/key-technologies/elasticsearch.md)
- [Kafka](content/system-design/key-technologies/kafka.md)
- [Temporal](content/system-design/key-technologies/temporal.md)
- [API Gateway](content/system-design/key-technologies/api-gateway.md)
- [Cassandra](content/system-design/key-technologies/cassandra.md)
- [DynamoDB](content/system-design/key-technologies/dynamodb.md)

### 설계 패턴 (1)

- [Common Patterns](content/system-design/common-patterns/patterns-overview.md)

### 문제별 설계 (16)

- [Bitly](content/system-design/problem-breakdowns/bitly.md)
- [Dropbox](content/system-design/problem-breakdowns/dropbox.md)
- [Local Delivery Service](content/system-design/problem-breakdowns/gopuff.md)
- [Ticketmaster](content/system-design/problem-breakdowns/ticketmaster.md)
- [FB News Feed](content/system-design/problem-breakdowns/fb-news-feed.md)
- [Tinder](content/system-design/problem-breakdowns/tinder.md)
- [LeetCode](content/system-design/problem-breakdowns/leetcode.md)
- [WhatsApp](content/system-design/problem-breakdowns/whatsapp.md)
- [Rate Limiter](content/system-design/problem-breakdowns/distributed-rate-limiter.md)
- [YouTube](content/system-design/problem-breakdowns/youtube.md)
- [FB Live Comments](content/system-design/problem-breakdowns/fb-live-comments.md)
- [YouTube Top K](content/system-design/problem-breakdowns/top-k.md)
- [Uber](content/system-design/problem-breakdowns/uber.md)
- [Web Crawler](content/system-design/problem-breakdowns/web-crawler.md)
- [Ad Click Aggregator](content/system-design/problem-breakdowns/ad-click-aggregator.md)
- [FB Post Search](content/system-design/problem-breakdowns/fb-post-search.md)

### 심화 주제 (2)

- [Proximity Search](content/system-design/advanced-topics/proximity-search.md)
- [Time Series Databases](content/system-design/advanced-topics/time-series-databases.md)

### 실제 사례 (6)

- [Shopify Inventory Reservations](content/system-design/in-the-wild/shopify-inventory-reservations.md)
- [Discord Message Storage](content/system-design/in-the-wild/discord-messages-scylladb.md)
- [Slack Job Queue](content/system-design/in-the-wild/slack-job-queue.md)
- [Figma Multiplayer](content/system-design/in-the-wild/figma-multiplayer.md)
- [Spotify Data Lake](content/system-design/in-the-wild/spotify-data-lake-point-queries.md)
- [Meta ZGateway](content/system-design/in-the-wild/meta-zgateway-zippydb.md)


## 로컬 실행

```sh
python3 -m http.server 8000
```

http://localhost:8000 에서 확인합니다. 파일을 더블클릭하면 fetch가 동작하지 않습니다.
Markdown은 제목, 문단, 글머리 목록, 링크, 강조, 인용, 코드 블록을 지원합니다.
원시 HTML, 표, Mermaid는 현재 지원하지 않습니다.
글 작성을 마치면 JSON 노드의 status를 draft에서 published로 바꿉니다.

## GitHub Pages 배포

저장소 Settings → Pages에서 Deploy from a branch, main, /(root)를 선택합니다.
이후 main에 push하면 자동 반영됩니다. 모든 정적 자산은 상대 경로를 사용합니다.
