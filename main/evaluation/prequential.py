import time

import numpy as np


def prequential(X, y, clf, n_train):

    row_num = y.shape[0]
    
    X_init = X[0:n_train]
    y_init = y[0:n_train]

    
    X_train = X[n_train:]
    y_train = y[n_train:]

    y_pre = np.zeros(row_num - n_train)
    times = np.zeros(row_num - n_train)

    clf.fit(X_init, y_init)

    for i in range(0, row_num - n_train):
        start = time.time()
        y_pre[i] = clf.predict(X_train[i, :].reshape(1, -1))
        clf.partial_fit(X_train[i, :].reshape(1, -1), y_train[i].reshape(1, -1).ravel())
        times[i] = (time.time() - start)

    return y_pre, times
