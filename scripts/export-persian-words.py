from mnk_persian_words import iter_words


for word in iter_words(mode="clean", min_length=2, order="dataset"):
    print(word)