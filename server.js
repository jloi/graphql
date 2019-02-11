var express = require('express')
var graphqlHTTP = require('express-graphql')
var { buildSchema } = require('graphql')

var library = {}

var schema = buildSchema(`
    enum Category {
        FICTION
        NONFICTION
        SCIFI
        CHILDREN
        ADULT
    }

    input BookInput {
        title: String
        author: String
        pages: Int
        categories: [Category]
        checkedOut: Boolean
    }

    type Book {
        id: ID!
        title: String
        author: String
        pages: Int
        categories: [Category]
        checkedOut: Boolean
    }

    type Query {
        books: [Book]
        book(id: ID!): Book
        booksByAuthor(author: String): [Book]
        booksByCategory(category: Category): [Book]
    }

    type Mutation {
        add(books: [BookInput!]): [Book]
        checkoutBook(id: ID!): Book
        returnBook(id: ID!): Book
        remove(id: ID!): Book
    }
`);

class Book {
    constructor(id, {title, author, pages, categories, checkedOut}) {
        this.id = id
        this.title = title
        this.author = author
        this.pages = pages
        this.categories = categories
        this.checkedOut = checkedOut
    }
}

var root = {
    add: function({books}) {
        var returnBooks = []
        for(let book of books) {
            var id = require('crypto').randomBytes(10).toString('hex')
            library[id] = book
            returnBooks.push(new Book(id, book))
        }
        return returnBooks
    },
    checkoutBook: function({id}) {
        if (!library[id]) {
            throw new Error("No book exists with id " + id)
        }
        library[id].checkedOut = true
        return new Book(id, library[id])
    },
    returnBook: function({id}) {
        if (!library[id]) {
            throw new Error("No book exists with id " + id)
        }
        library[id].checkedOut = false
        return new Book(id, library[id])
    },
    remove: function({id}) {
        if (!library[id]) {
            throw new Error("No book exists with id " + id)
        }
        var book = library[id]
        delete library[id]
        return new Book(id, book)
    },
    books: function() {
        var books = []
        for(id in library) {
            books.push(new Book(id, library[id]))
        }
        return books 
    },
    book: function({id}) {
        if (!library[id]) {
            throw new Error("No book exists with id " + id)
        }
        return new Book(id, library[id])
    },
    booksByAuthor: function({author}) {
        var books = this.books()
        var booksWithAuthor = []
        for(let book of books) {
            if (author === book.author) {
                booksWithAuthor.push(book)
            }
        }
        return booksWithAuthor
    },
    booksByCategory: function({category}) {
        var books = this.books()
        var booksWithCategory = []
        for(let book of books) {
            if (book.categories.indexOf(category) != -1) {
                booksWithCategory.push(book)
            }
        }
        return booksWithCategory
    }
};

var app = express();
app.use('/library/books', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/library/books');
