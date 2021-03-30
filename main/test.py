import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn import preprocessing
from sklearn.naive_bayes import GaussianNB
import sys
import time

from classifier.detector_classifier import DetectorClassifier
from concept_drift.adwin import AdWin
from concept_drift.page_hinkley import PageHinkley
from concept_drift.DDM import DDM
from evaluation.prequential import prequential
from sklearn.linear_model import LogisticRegression


def read_data(filename):
    df = pd.read_csv(filename)
    data = df.values
    return data[:, :-1], data[:, -1]


if __name__ == '__main__':
    
    X, y = read_data(sys.argv[1])

    w =int(sys.argv[2])
    n_train = int(w/10)
    
    clfs = [
        DetectorClassifier(GaussianNB(), PageHinkley(), np.unique(y)),
        DetectorClassifier(GaussianNB(), AdWin(), np.unique(y)),
        DetectorClassifier(GaussianNB(), DDM(), np.unique(y))]
    clfs_label = ["Page-Hinkley", "AdWin", "DDM"]
    
    f = plt.figure()
    plt.title("Accuracy (exact match)")
    plt.xlabel("Instances")
    plt.ylabel("Accuracy")

    for i in range(len(clfs)):
        print("\n{}:".format(clfs_label[i]))
        with np.errstate(divide='ignore', invalid='ignore'):
            y_pre, time = prequential(X, y, clfs[i], n_train)
        if clfs[i].__class__.__name__ == "DetectorClassifier":
            print("Drift detection: {}".format(clfs[i].change_detected))
        estimator = (y[n_train:] == y_pre) * 1
        print("Time taken: {}".format(time[i]))

        acc_run = np.convolve(estimator, np.ones((w,)) / w, 'same')
        print("Mean accuracy within the window {}: {}".format(w, 100*(np.mean(acc_run))))
        plt.plot(acc_run, "-", label=clfs_label[i])
    

        

    plt.legend(loc='lower right')
    plt.ylim([0, 1])
    f.savefig("plot.png", bbox_inches='tight')