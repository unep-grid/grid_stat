curl \
  -X POST 'https://api-search.unepgrid.ch/indexes/statistical_en/search' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer c9f3e368a1341b45f12cedc428414eb0fd451cd486831780a9010cb78d6b4b15' \
  --data-binary '{ "q": "local", "facets": ["sources"] }' | jq '.'