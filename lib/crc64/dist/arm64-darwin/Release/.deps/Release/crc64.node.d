cmd_Release/crc64.node := c++ -bundle -undefined dynamic_lookup -Wl,-search_paths_first -mmacosx-version-min=10.13 -arch arm64 -L./Release -stdlib=libc++ -L/opt/homebrew/opt/llvm/lib -o Release/crc64.node Release/obj.target/crc64/crc64.o 
