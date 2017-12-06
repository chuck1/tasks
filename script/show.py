
import todo

t = todo.Session('charles')

t.iter_tree()

t.show_tree(t.filter_open())

