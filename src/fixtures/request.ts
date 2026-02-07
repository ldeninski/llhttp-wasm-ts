export const requestFixtureStringPart1 = `GET /api/v1/whoami HTTP/2.0
Host: developer.mozilla.org
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0
Accept: */*
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br, zstd
Referer: https://developer.mozilla.org/en-US`;
export const requestFixtureStringPart2 = `/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/set
Connection: keep-alive
Cookie: _ga_B9CY1C9VBC=GS1.1.1741620178.5.1.1741620806.0.0.0; _ga=GA1.1.1725769720.1722229432; _ga_2VC139B3XV=GS2.1.s1764752973$o9$g0$t1764753133$j60$l0$h0
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Priority: u=4
Pragma: no-cache
Cache-Control: no-cache
TE: trailers


`;

export const requestFixtureString = `${requestFixtureStringPart1}${requestFixtureStringPart2}`;

export const requestFixture = new TextEncoder().encode(requestFixtureString);

export const requestFixturePart1 = new TextEncoder().encode(requestFixtureStringPart1);
export const requestFixturePart2 = new TextEncoder().encode(requestFixtureStringPart2);