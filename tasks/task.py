import tasks
import datetime
import bson

def breakpoint(): import pdb;pdb.set_trace();

class Task:    
    column_width = {'title': 48}
    
    def __init__(self, e, d):
        self.e = e
        self.__d = d

    def __getitem__(self, key):
        return self.__d[key]
    
    def __setitem__(self, key, value):
        self.__d[key] = value
    
    def get(self, key, default):
        return self.__d.get(key, default)

    def __lt__(self, other):
        if other['due'] is None: return True
        if self.__d['due'] is None: return False
        return self.__d['due'] < other['due']

    def comments(self):
        return []
    
    def due_str(self):
        due = self.__d['due']
        
        if due:
            due = pytz.utc.localize(due)
            due_str = '{:26s}'.format(datetimeToString(due))

            if due < now():
                due_str = crayons.red(due_str)
        else:
            due_str = '{:26s}'.format('')
        
        return due_str

    def status_str(self):
        s = Status(self.__d.get('status_last',0))
        return '{:11s}'.format(s.name)

    def to_array(self):
       
        def _f(k, v):
            if isinstance(v, datetime.datetime):
                v = v.timestamp()

            if isinstance(v, bson.objectid.ObjectId):
                v = str(v)

            return k, v

        d0 = dict(_f(k, v) for k, v in self.__d.items())

        del d0['_elephant']

        if not 'parent' in d0:
            d0['parent'] = None

        return d0
        
   
