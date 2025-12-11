push:
	@if "$(msg)"=="" ( \
		echo Error: Commit message missing. Usage: make push msg="your commit message" & exit 1 \
	) else ( \
		git add . && git commit -m "$(msg)" && git push origin master \
	)
