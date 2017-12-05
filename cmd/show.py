
import todo

t = todo.Session('charles')

t.show_tree(t.filter_open())

